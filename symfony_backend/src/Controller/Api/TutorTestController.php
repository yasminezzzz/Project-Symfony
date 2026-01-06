<?php

namespace App\Controller\Api;

use App\Entity\Test;
use App\Entity\Question;
use App\Entity\Subject;
use App\Entity\User;
use App\Entity\StudentGroup;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/tutor')]
class TutorTestController extends AbstractController
{
    private function getTutor(EntityManagerInterface $em): User
    {
        return $this->getUser() ?? $em->getRepository(User::class)->find(1);
    }

    // ---------------- CREATE TEST ----------------
    #[Route('/tests', methods: ['POST'])]
    public function createTest(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $subject = $em->getRepository(Subject::class)->find($data['subject_id'] ?? null);
        if (!$subject) {
            return $this->json(['error' => 'Subject not found'], 404);
        }

        $tutor = $this->getTutor($em);

        $test = new Test();
        $test->setSubject($subject);
        $test->setTutor($tutor);

        foreach ($data['questions'] ?? [] as $content) {
            $question = new Question();
            $question->setContent($content);
            $question->setTest($test);
            $em->persist($question);
        }

        $em->persist($test);
        $em->flush();

        return $this->json(['message' => 'Test created successfully']);
    }

    // ---------------- LIST TESTS ----------------
    #[Route('/tests', methods: ['GET'])]
    public function listTests(EntityManagerInterface $em): JsonResponse
    {
        $tutor = $this->getTutor($em);
        $tests = $em->getRepository(Test::class)->findBy(['tutor' => $tutor]);

        $result = [];
        foreach ($tests as $test) {
            $result[] = [
                'id' => $test->getId(),
                'subject' => $test->getSubject()->getName(),
                'subjectId' => $test->getSubject()->getId(),
                'questions' => array_map(
                    fn($q) => $q->getContent(),
                    $test->getQuestions()->toArray()
                ),
            ];
        }

        return $this->json($result);
    }

    // ---------------- UPDATE TEST ----------------
    #[Route('/tests/{id}', methods: ['PUT'])]
    public function updateTest(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $test = $em->getRepository(Test::class)->find($id);
        if (!$test) {
            return $this->json(['error' => 'Test not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        $subject = $em->getRepository(Subject::class)->find($data['subject_id'] ?? null);
        if (!$subject) {
            return $this->json(['error' => 'Subject not found'], 404);
        }

        $test->setSubject($subject);

        foreach ($test->getQuestions() as $old) {
            $em->remove($old);
        }

        foreach ($data['questions'] ?? [] as $content) {
            $q = new Question();
            $q->setContent($content);
            $q->setTest($test);
            $em->persist($q);
        }

        $em->flush();

        return $this->json(['message' => 'Test updated successfully']);
    }

    // ---------------- DELETE TEST ----------------
    #[Route('/tests/{id}', methods: ['DELETE'])]
    public function deleteTest(int $id, EntityManagerInterface $em): JsonResponse
    {
        $test = $em->getRepository(Test::class)->find($id);
        if (!$test) {
            return $this->json(['error' => 'Test not found'], 404);
        }

        foreach ($test->getQuestions() as $q) {
            $em->remove($q);
        }

        $em->remove($test);
        $em->flush();

        return $this->json(['message' => 'Test deleted successfully']);
    }

    // ---------------- GET GROUPS OF TUTOR ----------------
    #[Route('/groups', methods: ['GET'])]
    public function tutorGroups(EntityManagerInterface $em): JsonResponse
    {
        $tutor = $this->getTutor($em);

        $groups = $em->createQueryBuilder()
            ->select('DISTINCT sg')
            ->from(StudentGroup::class, 'sg')
            ->join(Test::class, 't', 'WITH', 'sg.subject = t.subject')
            ->where('t.tutor = :tutor')
            ->setParameter('tutor', $tutor)
            ->getQuery()
            ->getResult();

        return $this->json(array_map(fn($g) => [
            'id' => $g->getId(),
            'name' => $g->getName(),
            'level' => $g->getLevel(),
            'subject' => $g->getSubject()->getName(),
        ], $groups));
    }
}
